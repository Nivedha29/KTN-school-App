import "dotenv/config";

import argon2 from "argon2";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  Role,
} from "../src/generated/prisma/client";

/* =========================================================
   REQUIRED ENVIRONMENT VARIABLES
========================================================= */

function getRequiredEnv(
  name: string
): string {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} is required`
    );
  }

  return value;
}

const connectionString =
  getRequiredEnv(
    "DATABASE_URL"
  );

const adminName =
  getRequiredEnv(
    "ADMIN_NAME"
  );

const adminEmail =
  getRequiredEnv(
    "ADMIN_EMAIL"
  );

const adminPassword =
  getRequiredEnv(
    "ADMIN_PASSWORD"
  );

if (
  adminPassword.length < 12
) {
  throw new Error(
    "ADMIN_PASSWORD must be at least 12 characters"
  );
}

/* =========================================================
   PRISMA
========================================================= */

const adapter =
  new PrismaPg({
    connectionString,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

/* =========================================================
   MAIN SEED
========================================================= */

async function main() {
  console.log(
    "Starting KTN production seed..."
  );

  /* =======================================================
     ADMIN ACCOUNT
  ======================================================= */

  const passwordHash =
    await argon2.hash(
      adminPassword
    );

  const admin =
    await prisma.user.upsert({
      where: {
        email:
          adminEmail,
      },

      update: {
        name:
          adminName,

        passwordHash,

        role:
          Role.ADMIN,

        isActive:
          true,
      },

      create: {
        name:
          adminName,

        email:
          adminEmail,

        passwordHash,

        role:
          Role.ADMIN,

        isActive:
          true,
      },
    });

  await prisma.adminProfile.upsert({
    where: {
      userId:
        admin.id,
    },

    update: {},

    create: {
      userId:
        admin.id,
    },
  });

  console.log(
    `Admin ready: ${admin.email}`
  );

  /* =======================================================
     ACADEMIC YEAR
  ======================================================= */

  const academicYearName =
    "2026-2027";

  const academicYearStart =
    new Date(
      "2026-01-01T00:00:00.000Z"
    );

  const academicYearEnd =
    new Date(
      "2027-12-31T23:59:59.999Z"
    );

  /*
    Make every other academic year inactive.
  */

  await prisma.academicYear.updateMany({
    where: {
      name: {
        not:
          academicYearName,
      },

      isActive:
        true,
    },

    data: {
      isActive:
        false,
    },
  });

  const academicYear =
    await prisma.academicYear.upsert({
      where: {
        name:
          academicYearName,
      },

      update: {
        startDate:
          academicYearStart,

        endDate:
          academicYearEnd,

        isActive:
          true,
      },

      create: {
        name:
          academicYearName,

        startDate:
          academicYearStart,

        endDate:
          academicYearEnd,

        isActive:
          true,
      },
    });

  console.log(
    `Academic year ready: ${academicYear.name}`
  );

  /* =======================================================
     REMOVE UNUSED GRADES 8-12

     Current KTN structure supports Grade 1-7.
  ======================================================= */

  await prisma.grade.deleteMany({
    where: {
      academicYearId:
        academicYear.id,

      name: {
        in: [
          "Grade 8",
          "Grade 9",
          "Grade 10",
          "Grade 11",
          "Grade 12",
        ],
      },
    },
  });

  /* =======================================================
     GRADES 1-7
  ======================================================= */

  const grades: Array<{
    id: number;
    name: string;
  }> = [];

  for (
    let gradeNumber = 1;
    gradeNumber <= 7;
    gradeNumber++
  ) {
    const gradeName =
      `Grade ${gradeNumber}`;

    const grade =
      await prisma.grade.upsert({
        where: {
          name_academicYearId: {
            name:
              gradeName,

            academicYearId:
              academicYear.id,
          },
        },

        update: {
          name:
            gradeName,
        },

        create: {
          name:
            gradeName,

          academicYearId:
            academicYear.id,
        },
      });

    grades.push({
      id:
        grade.id,

      name:
        grade.name,
    });
  }

  console.log(
    "Grades 1-7 ready"
  );

  /* =======================================================
     SUBJECTS

     Grade 1:
       English
       Maths
       Tamil

     Grades 2-7:
       English
       Maths
       Tamil
       EVS
  ======================================================= */

  for (
    const grade of grades
  ) {
    const subjectNames =
      grade.name ===
      "Grade 1"
        ? [
            "English",
            "Maths",
            "Tamil",
          ]
        : [
            "English",
            "Maths",
            "Tamil",
            "EVS",
          ];

    for (
      const subjectName of
      subjectNames
    ) {
      await prisma.subject.upsert({
        where: {
          name_gradeId: {
            name:
              subjectName,

            gradeId:
              grade.id,
          },
        },

        update: {
          name:
            subjectName,
        },

        create: {
          name:
            subjectName,

          gradeId:
            grade.id,
        },
      });
    }
  }

  console.log(
    "Subjects ready"
  );

  /* =======================================================
     SCHOOL SETTINGS

     Important:
     Do NOT reset admissionOpen when settings already exist.

     If Admin manually closes admissions, running seed again
     must not automatically reopen admissions.
  ======================================================= */

  const existingSchoolSetting =
    await prisma.schoolSetting.findFirst({
      orderBy: {
        id:
          "asc",
      },
    });

  if (
    existingSchoolSetting
  ) {
    await prisma.schoolSetting.update({
      where: {
        id:
          existingSchoolSetting.id,
      },

      data: {
        schoolName:
          "KTN Digital School",

        shortName:
          "KTN",

        timezone:
          "Asia/Seoul",

        language:
          "en",
      },
    });
  } else {
    await prisma.schoolSetting.create({
      data: {
        schoolName:
          "KTN Digital School",

        shortName:
          "KTN",

        timezone:
          "Asia/Seoul",

        language:
          "en",

        admissionOpen:
          true,
      },
    });
  }

  console.log(
    "School settings ready"
  );

  /* =======================================================
     COMPLETE
  ======================================================= */

  console.log(
    "KTN production seed completed successfully."
  );
}

/* =========================================================
   EXECUTE
========================================================= */

main()
  .catch((error) => {
    console.error(
      "Seed failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });