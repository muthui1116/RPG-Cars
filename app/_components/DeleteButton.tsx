"use client";

import { useTransition } from "react";
import { deleteProduct } from "../_lib/actions/product";

export default function DeleteButton({ id }: { id: number }) {
	const [isPending, startTransition] = useTransition();

	function handleDelete() {
		const confirmed = window.confirm("Delete this product? This cannot be undone.");
		if (!confirmed) return;

		startTransition(async () => {
			await deleteProduct(id);
		});
	}

	return (
		<button
			type="button"
			onClick={handleDelete}
			disabled={isPending}
			className="flex-1 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
		>
			{isPending ? "Deleting..." : "Delete"}
		</button>
	);
}