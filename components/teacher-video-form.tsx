"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { uploadVideo } from "@/server/teacher-actions"
import { useToast } from "@/hooks/use-toast"
import { ThumbnailUpload } from "@/components/thumbnail-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getBunnyVideoMetadata } from "@/server/bunny-actions"
import BunnyLibraryPicker from "@/components/bunny-library-picker"

const gradeOptions = [
  { label: "First year", value: 1 },
  { label: "Second year", value: 2 },
  { label: "Third year", value: 3 },
]

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds || totalSeconds <= 0) return ""
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function TeacherVideoForm() {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [directPlayUrl, setDirectPlayUrl] = useState("") // Bunny Direct Play URL or HLS URL
  const [sourceType, setSourceType] = useState<"gdrive" | "youtube" | "vimeo" | "bunny" | "bunny_id">("bunny")
  const [grades, setGrades] = useState<number[]>([])
  const [month, setMonth] = useState<number | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isPending, startTransition] = useTransition()

  // Bunny metadata state (Video ID flow)
  const [metaDurationSec, setMetaDurationSec] = useState<number | undefined>(undefined)
  const [metaFetched, setMetaFetched] = useState(false)

  function toggleGrade(val: number) {
    setGrades((prev) => (prev.includes(val) ? prev.filter((g) => g !== val) : [...prev, val]))
  }

  const urlPlaceholder =
    sourceType === "youtube"
      ? "Paste a YouTube link (https://www.youtube.com/watch?v=...)"
      : sourceType === "vimeo"
        ? "Paste Vimeo embed code (<iframe ...>) or a Vimeo link"
        : sourceType === "bunny"
          ? "Paste Bunny embed HTML, a mediadelivery 'play' URL, or a CDN HLS .m3u8"
          : sourceType === "bunny_id"
            ? "Paste the Bunny Video ID (e.g., 0f0bd0ef-1111-2222-3333-1234567890ab)"
            : "Paste a direct MP4/HLS or Google Drive link"

  const helper =
    sourceType === "youtube"
      ? "We’ll convert watch/shorts URLs to embed automatically."
      : sourceType === "vimeo"
        ? 'Tip: Click "Share" → "Embed" on Vimeo and paste the <iframe ...> code here.'
        : sourceType === "bunny"
          ? "Examples: <iframe src='https://iframe.mediadelivery.net/embed/{LIB}/{ID}'>, https://iframe.mediadelivery.net/play/{LIB}/{ID}, or https://{cdn-host}/{VIDEO_ID}/playlist.m3u8"
          : sourceType === "bunny_id"
            ? "We’ll build the official embed URL from your Library ID and this Video ID."
            : "Direct MP4/HLS (.m3u8) or Google Drive file links can be used."

  async function handleFetchBunnyMeta() {
    const id = videoUrl.trim()
    if (!id) {
      toast({ title: "Missing ID", description: "Enter a Bunny Video ID first.", variant: "destructive" })
      return
    }
    startTransition(async () => {
      const res = await getBunnyVideoMetadata(id)
      if (!res.ok) {
        toast({ title: "Bunny lookup failed", description: res.error, variant: "destructive" })
        return
      }
      setMetaFetched(true)
      setMetaDurationSec(res.durationSeconds)
      if (res.title && !title) setTitle(res.title)
      if (res.thumbnailUrl && !thumbnailUrl) setThumbnailUrl(res.thumbnailUrl)
      if (res.durationSeconds) {
        const pretty = formatDuration(res.durationSeconds)
        if (pretty && !description.includes("Duration:")) {
          setDescription((d) => (d ? `${d}\nDuration: ${pretty}` : `Duration: ${pretty}`))
        }
      }
      toast({ title: "Fetched from Bunny", description: "Title and duration were imported." })
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!month) return
        startTransition(async () => {
          const res = await uploadVideo({
            title,
            category,
            description,
            grades,
            videoUrl,
            month,
            isFree,
            thumbnailUrl,
            sourceType,
            directPlayUrl: directPlayUrl || undefined,
          })
          if (res?.ok) {
            toast({
              title: "Video saved",
              description: isFree
                ? "Your free video is now visible on the homepage."
                : "Your paid video is available to students with access.",
            })
            setTitle("")
            setCategory("")
            setDescription("")
            setVideoUrl("")
            setDirectPlayUrl("")
            setGrades([])
            setMonth(null)
            setIsFree(false)
            setThumbnailUrl("")
            setSourceType("bunny")
            setMetaDurationSec(undefined)
            setMetaFetched(false)
          } else {
            toast({ title: "Error", description: res?.error ?? "Upload failed", variant: "destructive" })
          }
        })
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="v-title">Title</Label>
        <Input
          id="v-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="v-category">Subject</Label>
          <Input
            id="v-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Math, Physics, English..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={month?.toString() ?? ""} onValueChange={(v) => setMonth(Number.parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Thumbnail</Label>
        <ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
        <p className="text-xs text-muted-foreground">This image will be used as the video thumbnail.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-desc">Description</Label>
        <Textarea
          id="v-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="In this lesson..."
        />
        {metaDurationSec ? (
          <p className="text-xs text-emerald-700">Detected duration: {formatDuration(metaDurationSec)}</p>
        ) : metaFetched ? (
          <p className="text-xs text-muted-foreground">No duration returned for this video.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Grades</Label>
        <div className="flex flex-wrap gap-4">
          {gradeOptions.map((g) => (
            <label key={g.value} className="flex items-center gap-2 text-sm">
              <Checkbox checked={grades.includes(g.value)} onCheckedChange={() => toggleGrade(g.value)} />
              <span>{g.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label>Source type</Label>
          <RadioGroup
            value={sourceType}
            onValueChange={(v) => setSourceType(v as "gdrive" | "youtube" | "vimeo" | "bunny" | "bunny_id")}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="src-bn" value="bunny" />
              <Label htmlFor="src-bn" className="cursor-pointer">
                Bunny (embed, play URL, or HLS)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="src-vimeo" value="vimeo" />
              <Label htmlFor="src-vimeo" className="cursor-pointer">
                Vimeo (embed or link)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="src-yt" value="youtube" />
              <Label htmlFor="src-yt" className="cursor-pointer">
                YouTube (embed)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="src-gd" value="gdrive" />
              <Label htmlFor="src-gd" className="cursor-pointer">
                Direct MP4/HLS or Google Drive
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="src-bnid" value="bunny_id" />
              <Label htmlFor="src-bnid" className="cursor-pointer">
                Bunny (Video ID)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div className="grid">
            <Label>Free video</Label>
            <span className="text-xs text-muted-foreground">Free videos appear on the homepage.</span>
          </div>
          <Switch checked={isFree} onCheckedChange={setIsFree} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-url">{sourceType === "bunny_id" ? "Bunny Video ID" : "Video URL or Embed Code"}</Label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Textarea
            id="v-url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={urlPlaceholder}
            rows={3}
          />
          {sourceType === "bunny_id" && (
            <div className="flex items-start">
              <Button
                type="button"
                variant="outline"
                disabled={isPending || !videoUrl.trim()}
                onClick={() => void handleFetchBunnyMeta()}
                className="whitespace-nowrap"
              >
                {isPending ? "Fetching..." : "Fetch from Bunny"}
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{helper}</p>
        {sourceType === "bunny" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="v-direct">Bunny Direct Play URL (optional)</Label>
              <Input
                id="v-direct"
                value={directPlayUrl}
                onChange={(e) => setDirectPlayUrl(e.target.value)}
                placeholder="https://iframe.mediadelivery.net/play/{LIBRARY}/{VIDEO_ID} or https://{cdn-host}/{VIDEO_ID}/playlist.m3u8"
              />
              <p className="text-xs text-muted-foreground">
                Example: https://iframe.mediadelivery.net/play/478935/e25e0e1c-41b3-4b4c-b358-0acdf2eaf02d
              </p>
            </div>
            <div className="space-y-2">
              <Label>Pick from your Bunny Library</Label>
              <BunnyLibraryPicker
                onSelect={(choice) => {
                  const chosenUrl = choice.hlsUrl ?? choice.embedUrl
                  if (chosenUrl) setVideoUrl(chosenUrl)
                  if (!title && choice.title) setTitle(choice.title)
                  if (!thumbnailUrl && choice.thumbnailUrl) setThumbnailUrl(choice.thumbnailUrl)
                  if (choice.durationSeconds) {
                    const pretty = formatDuration(choice.durationSeconds)
                    if (pretty && !description.includes("Duration:")) {
                      setDescription((d) => (d ? `${d}\nDuration: ${pretty}` : `Duration: ${pretty}`))
                    }
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      <Button disabled={isPending || !month} type="submit">
        {isPending ? "Saving..." : "Save Video"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Use iframe for Bunny “play/embed” pages, and video for direct HLS/MP4. This matches Next.js guidance for
        embedding videos [^1][^2].
      </p>
    </form>
  )
}
