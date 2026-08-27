// JSON-LD <script> per Next guide (02-guides/json-ld.md): render structured data inline and
// escape `<` so a string in the payload can never close the script tag.
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
