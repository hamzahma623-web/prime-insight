"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Location = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

type RatingFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
};

function RatingField({
  label,
  value,
  onChange,
  required = false,
}: RatingFieldProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-800">
        {label}
        {required ? " *" : ""}
      </legend>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            aria-label={`${rating} von 5 Sternen`}
            onClick={() => onChange(rating)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition ${
              rating <= value
                ? "border-amber-400 bg-amber-50 text-amber-500"
                : "border-slate-200 bg-white text-slate-300 hover:border-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function PublicFeedbackPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [location, setLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [equipmentRating, setEquipmentRating] = useState(0);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);

  const [comment, setComment] = useState("");
  const [improvementSuggestion, setImprovementSuggestion] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadLocation() {
      try {
        const response = await fetch(
  `/api/public/locations/${encodeURIComponent(slug)}`,
  {
    cache: "no-store",
  }
);

const result = await response.json();

if (!response.ok || !result.ok) {
  throw new Error(
    result.error || "Standort konnte nicht geladen werden."
  );
}

setLocation(result.location as Location);
      } catch (error) {
        console.error("Location loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Der Standort konnte nicht geladen werden."
        );
      } finally {
        setIsLoadingLocation(false);
      }
    }

    void loadLocation();
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!location) {
      setErrorMessage("Der Standort konnte nicht ermittelt werden.");
      return;
    }

    if (overallRating < 1) {
      setErrorMessage("Bitte gib eine Gesamtbewertung ab.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: location.id,
          overallRating,
          cleanlinessRating: cleanlinessRating || undefined,
          equipmentRating: equipmentRating || undefined,
          atmosphereRating: atmosphereRating || undefined,
          staffRating: staffRating || undefined,
          comment,
          improvementSuggestion,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Das Feedback konnte nicht gespeichert werden."
        );
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Feedback submission failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Das Feedback konnte nicht gespeichert werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingLocation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="text-sm text-slate-500">Standort wird geladen …</p>
      </main>
    );
  }

  if (!location) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Standort nicht gefunden
          </h1>

          <p className="mt-3 text-sm text-slate-500">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (isSubmitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-900">
            Vielen Dank!
          </h1>

          <p className="mt-3 text-slate-500">
            Dein Feedback für {location.name} wurde erfolgreich übermittelt.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Fitness Level
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Wie war dein Training?
          </h1>

          <p className="mt-2 text-slate-500">
            {location.name} · Dein Feedback dauert weniger als eine Minute.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl bg-white p-6 shadow-xl sm:p-9"
        >
          <RatingField
            label="Gesamtbewertung"
            value={overallRating}
            onChange={setOverallRating}
            required
          />

          <div className="grid gap-7 sm:grid-cols-2">
            <RatingField
              label="Sauberkeit"
              value={cleanlinessRating}
              onChange={setCleanlinessRating}
            />

            <RatingField
              label="Geräte"
              value={equipmentRating}
              onChange={setEquipmentRating}
            />

            <RatingField
              label="Atmosphäre"
              value={atmosphereRating}
              onChange={setAtmosphereRating}
            />

            <RatingField
              label="Freundlichkeit"
              value={staffRating}
              onChange={setStaffRating}
            />
          </div>

          <div>
            <label
              htmlFor="comment"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Was hat dir heute gefallen?
            </label>

            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Dein positives Feedback …"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="improvement"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Was können wir verbessern?
            </label>

            <textarea
              id="improvement"
              rows={4}
              value={improvementSuggestion}
              onChange={(event) =>
                setImprovementSuggestion(event.target.value)
              }
              placeholder="Dein Verbesserungsvorschlag …"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Feedback wird gesendet …"
              : "Feedback absenden"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Deine Angaben werden vertraulich behandelt.
          </p>
        </form>
      </div>
    </main>
  );
}