// Development seed for the Mr Electron curriculum. It is intentionally
// upsert-based so running it does not erase a teacher's existing content.
// @ts-nocheck
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import User from './models/User';
import Course from './models/Course';
import Lesson from './models/Lesson';
import Exam from './models/Exam';
import EducationalLevel from './models/EducationalLevel';
import CourseAccess from './models/CourseAccess';

dotenv.config();

const levels = [
  ...Array.from({ length: 6 }, (_, index) => ({
    name: `Primary ${index + 1}`,
    nameAr: `الصف ${index + 1} الابتدائي`,
    level: 'primary',
    year: index + 1,
    order: index + 1,
    isActive: true
  })),
  ...Array.from({ length: 3 }, (_, index) => ({
    name: `Preparatory ${index + 1}`,
    nameAr: `الصف ${index + 1} الإعدادي`,
    level: 'prep',
    year: index + 1,
    order: index + 7,
    isActive: true
  }))
];

const getOrCreateUser = async (data: any) => {
  const existing = await User.findOne({ phone: data.phone });
  if (existing) return existing;
  return User.create(data);
};

const seedDB = async () => {
  await connectDB();

  const createdLevels = [];
  for (const level of levels) {
    createdLevels.push(await EducationalLevel.findOneAndUpdate(
      { order: level.order },
      level,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ));
  }

  const teacher = await getOrCreateUser({
    name: 'أيمن مشالي',
    phone: '01000000000',
    educationalLevel: createdLevels[8]._id,
    password: '12345678',
    role: 'teacher'
  });
  const student = await getOrCreateUser({
    name: 'طالب تجريبي',
    phone: '01100000000',
    educationalLevel: createdLevels[8]._id,
    password: '12345678',
    role: 'student'
  });

  const chapterOne = await Course.findOneAndUpdate(
    { title: 'الحركة والقوى', educationalLevel: createdLevels[8]._id, term: 'first' },
    {
      title: 'الحركة والقوى',
      educationalLevel: createdLevels[8]._id,
      term: 'first',
      description: 'مدخل إلى الحركة والقوى بطريقة مبسطة.',
      order: 1,
      isActive: true
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const chapterTwo = await Course.findOneAndUpdate(
    { title: 'الضوء والطاقة', educationalLevel: createdLevels[8]._id, term: 'second' },
    {
      title: 'الضوء والطاقة',
      educationalLevel: createdLevels[8]._id,
      term: 'second',
      description: 'فهم الضوء والطاقة من خلال التجارب اليومية.',
      order: 1,
      isActive: true
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const lesson = await Lesson.findOneAndUpdate(
    { courseId: chapterOne._id, order: 1 },
    {
      courseId: chapterOne._id,
      title: 'مفهوم الحركة',
      description: 'ما الحركة؟ وكيف نصفها؟',
      duration: 24,
      order: 1,
      videoUrl: 'https://www.youtube.com/watch?v=s7kLbthGnLE',
      videoProvider: 'youtube',
      videoId: 's7kLbthGnLE'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await Lesson.findOneAndUpdate(
    { courseId: chapterTwo._id, order: 1 },
    {
      courseId: chapterTwo._id,
      title: 'مصادر الطاقة',
      description: 'نتعرف على مصادر الطاقة حولنا.',
      duration: 28,
      order: 1,
      videoUrl: 'https://vimeo.com/76979871',
      videoProvider: 'vimeo',
      videoId: '76979871'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Exam.findOneAndUpdate(
    { title: 'اختبار الباب الأول', courseId: chapterOne._id },
    {
      title: 'اختبار الباب الأول',
      type: 'course',
      courseId: chapterOne._id,
      educationalLevel: null,
      isActive: true,
      timeLimitMin: 20
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await Exam.findOneAndUpdate(
    { title: 'اختبار العلوم العام', educationalLevel: createdLevels[8]._id },
    {
      title: 'اختبار العلوم العام',
      type: 'general',
      courseId: null,
      educationalLevel: createdLevels[8]._id,
      isActive: true,
      timeLimitMin: 30
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await CourseAccess.findOneAndUpdate(
    { userId: student._id, courseId: chapterOne._id },
    { enabled: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Mr Electron seed complete. Teacher: ${teacher.phone}; student: ${student.phone}; sample lesson: ${lesson._id}`);
  process.exit(0);
};

seedDB().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
