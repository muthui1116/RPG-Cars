"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addProduct } from "../action/addProduct";

const initialState = { success: false, message: "" };

export default function AddProductModal() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // NEW: track previews for the gallery images (an array, since there can be many)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [state, formAction, isPending] = useActionState(
    async (prevState: typeof initialState, formData: FormData) => {
      const result = await addProduct(prevState, formData);

      if (result.success) {
        setOpen(false);
        setPreview(null);
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPreview(URL.createObjectURL(file));
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
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;

                  // Convert the FileList into a real array, then build
                  // a temporary preview URL for each file.
                  const urls = Array.from(files).map((file) =>
                    URL.createObjectURL(file)
                  );
                  setGalleryPreviews(urls);
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