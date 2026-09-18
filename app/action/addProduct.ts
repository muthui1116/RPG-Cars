"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import db from "../lib/db";
import { uploadImage } from "../lib/cloudinary";

type ActionState = {
  success: boolean;
  message: string;
};

const MAX_GALLERY_IMAGES = 5;
const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;

function isUniqueViolation(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function addProduct(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = formData.get("price") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const mainImageFile = formData.get("image") as File;

  // getAll() grabs every file uploaded under the "galleryImages" field name
  const galleryFiles = formData.getAll("galleryImages") as File[];

  if (!mainImageFile || mainImageFile.size === 0) {
    return { success: false, message: "Main image is required." };
  }

  const totalUploadBytes = [mainImageFile, ...galleryFiles].reduce(
    (total, file) => total + (file?.size ?? 0),
    0
  );
  if (galleryFiles.length > MAX_GALLERY_IMAGES) {
    return { success: false, message: "You can upload up to 5 gallery images." };
  }
  if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
    return {
      success: false,
      message: "The selected images are too large. Choose smaller images.",
    };
  }

  try {
    // ---- Process and save the main image ----
    const mainImageBuffer = Buffer.from(await mainImageFile.arrayBuffer());

    const mainProcessed = await sharp(mainImageBuffer)
      .rotate() // auto-rotate based on EXIF data
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Date.now() makes the filename unique so re-uploads never overwrite each other
    const mainFilename = `${slug}-main-${Date.now()}.webp`;
    const mainImageUrl = await uploadImage(mainProcessed, mainFilename.replace(/\.webp$/, ""));

    // ---- Insert the product first, so we get its id back ----
    const productResult = await db.query(
      `INSERT INTO products (name, slug, price, image_url, category, description, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING id`,
      [name, slug, price, mainImageUrl, category, description]
    );

    const productId = productResult.rows[0].id;

    // ---- Process and save each gallery image ----
    // A plain for-loop (not .map + Promise.all) keeps this easy to follow —
    // each image finishes processing before the next one starts.
    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i];

      // Skip empty file inputs (happens if the field was left blank)
      if (!file || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());

      const processed = await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const galleryFilename = `${slug}-gallery-${Date.now()}-${i}.webp`;
      const imageUrl = await uploadImage(
        processed,
        galleryFilename.replace(/\.webp$/, "")
      );

      await db.query(
        `INSERT INTO product_images (product_id, image_url, sort_order)
         VALUES ($1, $2, $3)`,
        [productId, imageUrl, i]
      );
    }

    revalidatePath("/"); // refresh the products list page's cache
    revalidatePath(`/products/${slug}`); // refresh this product's details page too

    return { success: true, message: "Product added successfully!" };
  } catch (error) {
    console.error("Failed to add product:", error);

    if (isUniqueViolation(error)) {
      return {
        success: false,
        message: "A product with that slug already exists. Please choose a different one.",
      };
    }

    return { success: false, message: "Something went wrong. Please try again." };
  }
}

export async function deleteProduct(id: number) {
  try {
    // Soft delete: flip is_active to false instead of removing the row.
    // ProductsList only ever selects WHERE is_active = true, so this
    // makes the product disappear from the storefront immediately —
    // but keeps the row (and its image files, and any order history
    // that references it) intact.
    const result = await db.query(
      "UPDATE products SET is_active = false WHERE id = $1 RETURNING slug",
      [id]
    );

    const slug = result.rows[0]?.slug;

    revalidatePath("/"); // refresh the products list page's cache
    if (slug) {
      revalidatePath(`/products/${slug}`); // refresh this product's details page too
    }

    return { success: true, message: "Product deleted." };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

export async function updateProduct(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = formData.get("price") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const newImageFile = formData.get("image") as File | null;

  try {
    let imageUrl: string | null = null;

    // Only touch the file system / DB image column if a new file was actually chosen.
    // An empty file input still shows up in FormData, so we check size, not just existence.
    if (newImageFile && newImageFile.size > 0) {
      const buffer = Buffer.from(await newImageFile.arrayBuffer());

      const processed = await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = `${slug}-main-${Date.now()}.webp`;
      imageUrl = await uploadImage(processed, filename.replace(/\.webp$/, ""));
    }

    // Build the query conditionally: only overwrite image_url if a new one was uploaded.
    // COALESCE($6, image_url) keeps the existing image when $6 (imageUrl) is NULL.
    await db.query(
      `UPDATE products
       SET name = $1, slug = $2, price = $3, category = $4, description = $5, image_url = COALESCE($6, image_url)
       WHERE id = $7`,
      [name, slug, price, category, description, imageUrl, id]
    );

    revalidatePath("/");
    revalidatePath(`/products/${slug}`);

    return { success: true, message: "Product updated successfully!" };
  } catch (error) {
    console.error("Failed to update product:", error);

    if (isUniqueViolation(error)) {
      return {
        success: false,
        message: "A product with that slug already exists. Please choose a different one.",
      };
    }

    return { success: false, message: "Something went wrong. Please try again." };
  }
}