"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateProduct } from "../_lib/actions/product";

type Product = {
	id: number;
	name: string;
	slug: string;
	price: number;
	category: string | null;
	description: string | null;
	image_url: string;
};

const initialState = { success: false, message: "" };

export default function EditProductModal({
	product,
	onClose,
}: {
	product: Product;
	onClose: () => void;
}) {
	const [state, formAction, isPending] = useActionState(updateProduct, initialState);
	const closedRef = useRef(false);

	// Once the update succeeds, close the modal automatically
	useEffect(() => {
		if (state.success && !closedRef.current) {
			closedRef.current = true;
			onClose();
		}
	}, [state.success, onClose]);

	// Close on outside click
	function handleBackdropClick() {
		onClose();
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={handleBackdropClick}
		>
			<div
				className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						✕
					</button>
				</div>

				<form action={formAction} className="space-y-4">
					{/* Hidden field so the server action knows which row to update */}
					<input type="hidden" name="id" value={product.id} />

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Name
						</label>
						<input
							type="text"
							name="name"
							defaultValue={product.name}
							required
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Slug
						</label>
						<input
							type="text"
							name="slug"
							defaultValue={product.slug}
							required
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Price
						</label>
						<input
							type="number"
							step="0.01"
							name="price"
							defaultValue={product.price}
							required
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Category
						</label>
						<input
							type="text"
							name="category"
							defaultValue={product.category ?? ""}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							name="description"
							defaultValue={product.description ?? ""}
							rows={3}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Replace main image (optional)
						</label>
						<input
							type="file"
							name="image"
							accept="image/*"
							className="w-full text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Add gallery images (optional)
						</label>
						<input
							type="file"
							name="galleryImages"
							accept="image/*"
							multiple
							className="w-full text-sm"
						/>
					</div>

					{state.message && !state.success && (
						<p className="text-sm text-red-600">{state.message}</p>
					)}

					<div className="flex gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
						>
							{isPending ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}