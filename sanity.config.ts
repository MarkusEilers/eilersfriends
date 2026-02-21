import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemas";

export default defineConfig({
  name: "eilersfriends",
  title: "Eilers & Friends CMS",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Site Settings (singleton)
            S.listItem()
              .title("Site Settings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),
            S.divider(),
            // Programs
            S.listItem()
              .title("Programs")
              .child(
                S.list()
                  .title("Programs")
                  .items([
                    S.documentTypeListItem("program").title("Programs"),
                    S.documentTypeListItem("programPhase").title("Phases"),
                    S.documentTypeListItem("programStep").title("Steps"),
                  ])
              ),
            // Frameworks
            S.documentTypeListItem("framework").title("Frameworks"),
            S.divider(),
            // Blog
            S.listItem()
              .title("Blog")
              .child(
                S.list()
                  .title("Blog")
                  .items([
                    S.documentTypeListItem("blogPost").title("Posts"),
                    S.documentTypeListItem("category").title("Categories"),
                  ])
              ),
            S.divider(),
            // Team
            S.documentTypeListItem("coach").title("Coaches"),
            S.documentTypeListItem("testimonial").title("Testimonials"),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
});
