"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import ProfileImageUpload from "@/components/profile/profile-image-upload";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
}

export default function ProfileForm() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setName(data.user.name || "");
        setImage(data.user.image);
      } else {
        setError(data.error || "Error al cargar el perfil");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSuccess("Perfil actualizado correctamente");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Error al actualizar el perfil");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  }

  function handleImageUpload(url: string) {
    setImage(url);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
          {success}
        </div>
      )}

      {/* Imagen de perfil */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Foto de perfil
        </label>
        <ProfileImageUpload
          currentImage={image}
          onUploadComplete={handleImageUpload}
        />
      </div>

      {/* Nombre */}
      <Input
        label="Nombre"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        disabled={isSaving}
      />

      {/* Email (solo lectura) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={user?.email || ""}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">El email no se puede cambiar</p>
      </div>

      {/* Fecha de registro */}
      {user?.createdAt && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Miembro desde
          </label>
          <p className="text-gray-600">
            {new Date(user.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      <Button type="submit" fullWidth isLoading={isSaving}>
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}