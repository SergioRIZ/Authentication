"use client";

export default function DeleteAccountButton() {
  return (
    <button
      type="button"
      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
      onClick={() => alert("Funcionalidad próximamente")}
    >
      Eliminar cuenta
    </button>
  );
}