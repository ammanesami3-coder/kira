"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Loader2,
} from "lucide-react";

import { adminKeys } from "@/lib/admin/query-keys";
import { uploadCarImage } from "@/lib/upload";
import {
  listCarImages,
  addCarImages,
  deleteCarImage,
  setPrimaryImage,
  reorderCarImages,
} from "@/server/admin";
import type { CarImage } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageManager({
  carId,
  initialImages,
}: {
  carId: string;
  initialImages: CarImage[];
}) {
  const t = useTranslations("admin.images");
  const tCommon = useTranslations("admin.common");
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const key = adminKeys.images(carId);
  const { data: images = [] } = useQuery({
    queryKey: key,
    queryFn: () => listCarImages(carId),
    initialData: initialImages,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: adminKeys.cars });
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((f) => uploadCarImage(f, carId)),
      );
      const res = await addCarImages({ car_id: carId, images: uploaded });
      if (!res.ok) throw new Error(res.error);
      refresh();
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const setPrimary = useMutation({
    mutationFn: (imageId: string) =>
      setPrimaryImage({ car_id: carId, image_id: imageId }),
    onSuccess: (res) => {
      if (res.ok) refresh();
      else toast.error(tCommon("error"));
    },
    onError: () => toast.error(tCommon("error")),
  });

  const remove = useMutation({
    mutationFn: (img: CarImage) =>
      deleteCarImage({ id: img.id, storage_path: img.storage_path }),
    onSuccess: (res) => {
      if (res.ok) refresh();
      else toast.error(tCommon("error"));
    },
    onError: () => toast.error(tCommon("error")),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderCarImages({ car_id: carId, ordered_ids: orderedIds }),
    onSuccess: (res) => {
      if (res.ok) refresh();
      else toast.error(tCommon("error"));
    },
    onError: () => toast.error(tCommon("error")),
  });

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    // Optimistic reorder for snappy UI.
    qc.setQueryData<CarImage[]>(key, next);
    reorder.mutate(next.map((i) => i.id));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? t("uploading") : t("upload")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-xs">{t("dragHint")}</p>

        {images.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
            {t("empty")}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, index) => (
              <li
                key={img.id}
                className="bg-muted group relative overflow-hidden rounded-lg border"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={img.url}
                    alt={img.alt ?? ""}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {img.is_primary && (
                    <span className="bg-primary text-primary-foreground absolute start-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                      <Star className="size-3 fill-current" />
                      {t("primary")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                      aria-label={t("moveUp")}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={
                        index === images.length - 1 || reorder.isPending
                      }
                      onClick={() => move(index, 1)}
                      aria-label={t("moveDown")}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {!img.is_primary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={setPrimary.isPending}
                        onClick={() => setPrimary.mutate(img.id)}
                        aria-label={t("setPrimary")}
                      >
                        <Star className="size-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-7"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(img)}
                      aria-label={t("remove")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
