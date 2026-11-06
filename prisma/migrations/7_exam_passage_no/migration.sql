-- IELTS Reading questions belong to passage 1 or 2
ALTER TABLE "ExamQuestion" ADD COLUMN "passageNo" INTEGER NOT NULL DEFAULT 1;
