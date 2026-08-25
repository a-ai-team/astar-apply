import { verifyStaff } from "@/lib/dal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadDropzone } from "@/components/corpus/upload-dropzone";
import { createQaSource, createTextSource } from "../actions";

export default async function CorpusUploadPage() {
  await verifyStaff();
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Upload to the corpus</h1>
        <p className="mt-1 text-sm text-muted">Photos of notes and PDFs are transcribed by Claude; text and Q&amp;A go straight to chunks. Everything lands in review — nothing reaches students until approved.</p>
      </div>
      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files">Photos &amp; PDFs</TabsTrigger>
          <TabsTrigger value="qa">Q&amp;A pair</TabsTrigger>
          <TabsTrigger value="text">Text / notes</TabsTrigger>
        </TabsList>
        <TabsContent value="files">
          <UploadDropzone />
        </TabsContent>
        <TabsContent value="qa">
          <form action={createQaSource} className="flex max-w-2xl flex-col gap-3" data-testid="qa-form">
            <label className="text-sm">Question
              <Input name="question" required placeholder="e.g. How early should I apply for spring weeks?" className="mt-1" />
            </label>
            <label className="text-sm">Answer — in your own voice
              <textarea name="answer" required rows={8} className="mt-1 w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-accent" />
            </label>
            <div><Button type="submit">Add Q&amp;A</Button></div>
          </form>
        </TabsContent>
        <TabsContent value="text">
          <form action={createTextSource} className="flex max-w-2xl flex-col gap-3" data-testid="text-form">
            <label className="text-sm">Title
              <Input name="title" required className="mt-1" />
            </label>
            <label className="text-sm">Text (Markdown headings help chunking)
              <textarea name="text" required rows={16} className="mt-1 w-full rounded-md border border-border bg-surface p-3 font-mono text-xs outline-none focus:border-accent" />
            </label>
            <div><Button type="submit">Add text</Button></div>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
}
