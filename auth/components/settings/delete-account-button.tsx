"use client";

export default function DeleteAccountButton() {
  return (
    <button
      type="button"
      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      onClick={() => alert("Funcionalidad próximamente")}
    >
      Eliminar cuenta
    </button>
  );
}