"use client";

import { useState } from "react";
import EditProductModal from "./EditProductModal";

type Product = {
	id: number;
	name: string;
	slug: string;
	price: number;
	category: string | null;
	description: string | null;
	image_url: string;
};

export default function EditButton({ product }: { product: Product }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="flex-1 text-sm font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors"
			>
				Edit
			</button>

			{isOpen && (
				<EditProductModal product={product} onClose={() => setIsOpen(false)} />
			)}
		</>
	);
}