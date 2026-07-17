export function GET() {
  return Response.json({
    name: "Open Agency",
    short_name: "Open Agency",
    description: "Practical AI guides, tools, and workflow systems.",
    start_url: "/",
    display: "standalone",
    background_color: "#060e20",
    theme_color: "#00daf3",
    icons: [
      {
        src: "/icon.svg",
        sizes: "32x32",
        type: "image/svg+xml",
      },
    ],
  });
}
