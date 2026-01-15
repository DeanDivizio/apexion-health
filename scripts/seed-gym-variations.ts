import { prisma } from "../lib/db/prisma";
import { GRIP_TEMPLATE, PLANE_TEMPLATE, WIDTH_TEMPLATE } from "../lib/gym/constants";

type TemplateInput = {
  id: string;
  label: string;
  options: Array<{ key: string; label: string; order?: number }>;
};

async function upsertTemplate(template: TemplateInput) {
  await prisma.gymVariationTemplate.upsert({
    where: { id: template.id },
    create: {
      id: template.id,
      label: template.label,
      options: {
        create: template.options.map((option) => ({
          key: option.key,
          label: option.label,
          order: option.order,
        })),
      },
    },
    update: {
      label: template.label,
      options: {
        deleteMany: {},
        create: template.options.map((option) => ({
          key: option.key,
          label: option.label,
          order: option.order,
        })),
      },
    },
  });
}

async function main() {
  await upsertTemplate(GRIP_TEMPLATE);
  await upsertTemplate(PLANE_TEMPLATE);
  await upsertTemplate(WIDTH_TEMPLATE);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
