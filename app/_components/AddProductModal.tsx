"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addProduct } from "../action/addProduct";

const initialState = { success: false, message: "" };
const MAX_GALLERY_IMAGES = 5;
const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.78)
  );

  if (!blob) throw new Error("Image compression failed.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  input.files = dataTransfer.files;
}

export default function AddProductModal() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [mainUploadBytes, setMainUploadBytes] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  // NEW: track previews for the gallery images (an array, since there can be many)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [state, formAction, isPending] = useActionState(
    async (prevState: typeof initialState, formData: FormData) => {
      let result: typeof initialState;
      try {
        result = await addProduct(prevState, formData);
      } catch (error) {
        console.error("Add product failed:", error);
        return {
          success: false,
          message: "Product upload failed. Please use smaller images and try again.",
        };
      }

      if (result.success) {
        setOpen(false);
        setPreview(null);
        setMainUploadBytes(0);
        setUploadMessage("");
        setGalleryPreviews([]);
        startTransition(() => {
          router.refresh();
        });
      }

      return result;
    },
    initialState
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white rounded-lg px-4 py-2 font-medium"
      >
        + Add Product
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <form
            action={formAction}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold">Add Product</h2>

            {state.message && <p className="text-sm">{state.message}</p>}

            <input
              type="text"
              name="name"
              placeholder="Product name"
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, "-"))
              }
              required
              className="w-full border rounded-lg px-3 py-2"
            />

            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
            />

            <input
              type="number"
              name="price"
              step="0.01"
              placeholder="Price"
              required
              className="w-full border rounded-lg px-3 py-2"
            />

            {/* Main image — unchanged, still just one file */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main image
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    const compressed = await compressImage(file);
                    setInputFiles(e.currentTarget, [compressed]);
                    setMainUploadBytes(compressed.size);
                    setUploadMessage("");
                    setPreview(URL.createObjectURL(compressed));
                  } catch {
                    setPreview(null);
                    setMainUploadBytes(0);
                    setUploadMessage("This image could not be processed.");
                    e.currentTarget.value = "";
                  }
                }}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              {preview && (
                <div className="relative w-32 h-32 rounded-lg border overflow-hidden mt-2">
                  <Image src={preview} alt="Preview" fill unoptimized className="object-cover" />
                </div>
              )}
            </div>

            {/* NEW: Gallery images — multiple files allowed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gallery images (optional)
              </label>
              <input
                type="file"
                name="galleryImages"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

                  if (files.length > MAX_GALLERY_IMAGES) {
                    e.currentTarget.value = "";
                    setGalleryPreviews([]);
                    setUploadMessage(`Choose up to ${MAX_GALLERY_IMAGES} gallery images.`);
                    return;
                  }

                  try {
                    const compressed = await Promise.all(
                      Array.from(files).map(compressImage)
                    );
                    const totalBytes = compressed.reduce(
                      (total, file) => total + file.size,
                      0
                    );

                    if (mainUploadBytes + totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
                      e.currentTarget.value = "";
                      setGalleryPreviews([]);
                      setUploadMessage("The selected images are too large. Choose fewer or smaller images.");
                      return;
                    }

                    setInputFiles(e.currentTarget, compressed);
                    setUploadMessage("");
                    setGalleryPreviews(
                      compressed.map((file) => URL.createObjectURL(file))
                    );
                  } catch {
                    e.currentTarget.value = "";
                    setGalleryPreviews([]);
                    setUploadMessage("One of the gallery images could not be processed.");
                  }
                }}
                className="w-full border rounded-lg px-3 py-2"
              />

              {galleryPreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {galleryPreviews.map((url, index) => (
                    <div
                      key={index}
                      className="relative w-16 h-16 rounded-lg border overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Gallery preview ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              name="category"
              placeholder="Category"
              className="w-full border rounded-lg px-3 py-2"
            />

            <textarea
              name="description"
              placeholder="Description"
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />

            {uploadMessage && <p className="text-sm text-red-600">{uploadMessage}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 border rounded-lg py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-gray-900 text-white rounded-lg py-2 disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}