<!-- impeccable:product-schema 1 -->

# Mr Electron

Mr Electron is an Arabic-first web platform for Ayman Meshally's science students. It contains a public landing page, a student portal, and a teacher/admin workspace built on the existing React, TypeScript, Vite, Tailwind, Radix UI, Express, and Mongoose stack.

The product serves six primary and three preparatory grades. Students register with name, phone, grade, and password. Their grade contains first- and second-term chapters; chapters contain lessons and chapter exams; general exams belong directly to a grade.

The teacher manually enables chapter access per student. Opening a chapter opens all lessons by default, while an individual lesson can be locked or unlocked as an exception. Students can preview the chapter and lesson outline before activation, but videos remain locked. Lesson video URLs come from YouTube or Vimeo and are checked by the API before an embed URL is returned.

The public landing page explains the classroom model and links to the separately hosted student and teacher apps; it does not sell subscriptions or expose protected curriculum data. The product does not include paid subscriptions, payments, assignments, notes, or course/lesson images. Teacher logo, colors, and final assets are pending, so the interface uses a temporary text wordmark and restrained geometry instead of the old electron assets. The UI is RTL, responsive, keyboard-friendly, and includes explicit loading, empty, error, locked, and active states.
