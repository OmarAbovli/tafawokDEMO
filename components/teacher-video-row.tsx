"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { updateVideo, deleteVideo } from "@/server/teacher-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Video = {
  id: string
  title: string
  description: string
  url: string
}

export function TeacherVideoRow({ video }: { video: Video }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [url, setUrl] = useState(video.url)

  async function onSave() {
    startSaving(async () => {
      const res = await updateVideo(video.id, { title, description, url })
      toast({
        title: res.ok ? "Saved" : "Error",
        description: res.ok ? "Video updated" : ((res as any).error ?? "Failed to update"),
        variant: res.ok ? "default" : "destructive",
      })
      if (res.ok) setIsEditing(false)
    })
  }

  function onDeleteConfirmed() {
    startDeleting(async () => {
      const res = await deleteVideo(video.id)
      toast({
        title: res.ok ? "Deleted" : "Error",
        description: res.ok ? "Video removed" : ((res as any).error ?? "Failed to delete"),
        variant: res.ok ? "default" : "destructive",
      })
      if (res.ok) {
        // Refresh the server component list so the row disappears
        router.refresh()
      }
    })
  }

  return (
    <>
      <tr className="border-t align-top">
        <td className="py-2 pr-3">
          {isEditing ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          ) : (
            <div className="font-medium">{video.title || "Untitled"}</div>
          )}
        </td>
        <td className="py-2 pr-3">
          {isEditing ? (
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          ) : (
            <div className="line-clamp-2 max-w-[420px] text-muted-foreground">{video.description}</div>
          )}
        </td>
        <td className="py-2 pr-3">
          {isEditing ? (
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          ) : (
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[280px] truncate text-emerald-700 underline"
            >
              {video.url}
            </a>
          )}
        </td>
        <td className="py-2 pr-3">
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button size="sm" disabled={isSaving || isDeleting} onClick={onSave}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSaving || isDeleting}
                  onClick={() => {
                    setTitle(video.title)
                    setDescription(video.description)
                    setUrl(video.url)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSaving || isDeleting}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={isSaving || isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The video will be permanently removed from your list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteConfirmed} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}
