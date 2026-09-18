"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "./actions";

const STATUSES = ["pending", "paid", "cancelled", "delivered"] as const;
type Status = (typeof STATUSES)[number];

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as Status;
    const previous = status;
    setStatus(newStatus); // optimistic
    setError(null);

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        setStatus(previous); // revert on failure
        setError(result.error ?? "Update failed");
      }
    });
  }

  return (
    <div>
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className={`text-xs font-medium rounded-md border px-2 py-1 disabled:opacity-60 ${
          status === "paid"
            ? "bg-green-50 border-green-200 text-green-700"
            : status === "cancelled"
            ? "bg-red-50 border-red-200 text-red-700"
            : status === "delivered"
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-yellow-50 border-yellow-200 text-yellow-700"
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}