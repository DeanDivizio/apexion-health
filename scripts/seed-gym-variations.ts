import { prisma } from "../lib/db/prisma";
import {
  FOOT_ANGLE_TEMPLATE,
  FOOT_VERTICAL_POSITION_TEMPLATE,
  GRIP_ASSISTANCE_TEMPLATE,
  GRIP_TECHNIQUE_TEMPLATE,
  GRIP_TEMPLATE,
  HEEL_ELEVATION_TEMPLATE,
  PLANE_ANGLE_TEMPLATE,
  SUPPORT_TEMPLATE,
  WIDTH_TEMPLATE,
} from "../lib/gym";

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
  await upsertTemplate(PLANE_ANGLE_TEMPLATE);
  await upsertTemplate(WIDTH_TEMPLATE);
  await upsertTemplate(SUPPORT_TEMPLATE);
  await upsertTemplate(GRIP_TECHNIQUE_TEMPLATE);
  await upsertTemplate(GRIP_ASSISTANCE_TEMPLATE);
  await upsertTemplate(FOOT_VERTICAL_POSITION_TEMPLATE);
  await upsertTemplate(FOOT_ANGLE_TEMPLATE);
  await upsertTemplate(HEEL_ELEVATION_TEMPLATE);
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
