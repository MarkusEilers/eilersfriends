import { defineType, defineField } from "sanity";

export const programStep = defineType({
  name: "programStep",
  title: "Program Step",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.de", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "stepType",
      title: "Step Type",
      type: "string",
      options: {
        list: [
          { title: "Information", value: "information" },
          { title: "Exercise / Training", value: "exercise" },
          { title: "Workbook / Arbeitsergebnis", value: "workbook" },
          { title: "Sparring Session", value: "sparring" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Step Order",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localeText",
    }),
    defineField({
      name: "estimatedMinutes",
      title: "Estimated Duration (minutes)",
      type: "number",
    }),

    // --- Information Step Content ---
    defineField({
      name: "videoUrl",
      title: "Video URL (YouTube/Vimeo)",
      type: "url",
      hidden: ({ parent }) => parent?.stepType !== "information",
    }),
    defineField({
      name: "content",
      title: "Content (Rich Text)",
      type: "localeRichText",
      hidden: ({ parent }) =>
        !["information", "exercise"].includes(parent?.stepType),
    }),
    defineField({
      name: "downloads",
      title: "Downloadable Files",
      type: "array",
      of: [
        {
          type: "file",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "localeString",
            },
          ],
        },
      ],
      hidden: ({ parent }) =>
        !["information", "exercise"].includes(parent?.stepType),
    }),

    // --- Exercise Step Content ---
    defineField({
      name: "checklist",
      title: "Exercise Checklist",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "item", title: "Checklist Item", type: "localeString" },
          ],
        },
      ],
      hidden: ({ parent }) => parent?.stepType !== "exercise",
    }),

    // --- Workbook Step Content ---
    defineField({
      name: "workbookTemplate",
      title: "Workbook Template (Download)",
      type: "file",
      hidden: ({ parent }) => parent?.stepType !== "workbook",
    }),
    defineField({
      name: "workbookInstructions",
      title: "Workbook Instructions",
      type: "localeRichText",
      hidden: ({ parent }) => parent?.stepType !== "workbook",
    }),
    defineField({
      name: "acceptedFileTypes",
      title: "Accepted File Types",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "PDF", value: "application/pdf" },
          { title: "Word", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
          { title: "Excel", value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
          { title: "PowerPoint", value: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
          { title: "Image", value: "image/*" },
        ],
      },
      hidden: ({ parent }) => parent?.stepType !== "workbook",
    }),

    // --- Sparring Step Content ---
    defineField({
      name: "sparringCoach",
      title: "Assigned Coach",
      type: "reference",
      to: [{ type: "coach" }],
      hidden: ({ parent }) => parent?.stepType !== "sparring",
    }),
    defineField({
      name: "sparringDurationMinutes",
      title: "Session Duration (minutes)",
      type: "number",
      initialValue: 60,
      hidden: ({ parent }) => parent?.stepType !== "sparring",
    }),
    defineField({
      name: "sparringDescription",
      title: "Sparring Description",
      type: "localeRichText",
      hidden: ({ parent }) => parent?.stepType !== "sparring",
    }),

    // --- Prerequisites ---
    defineField({
      name: "prerequisites",
      title: "Prerequisites (Steps that must be completed first)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "programStep" }] }],
    }),
  ],
  orderings: [
    {
      title: "Step Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title.de",
      stepType: "stepType",
      order: "order",
    },
    prepare({ title, stepType, order }) {
      const typeEmoji: Record<string, string> = {
        information: "📖",
        exercise: "🏋️",
        workbook: "📝",
        sparring: "🤝",
      };
      return {
        title: `${order}. ${typeEmoji[stepType] || "📌"} ${title}`,
        subtitle: stepType,
      };
    },
  },
});
