ALTER TABLE "Invoice"
ADD COLUMN "sourceDocumentPath" TEXT,
ADD COLUMN "sourceDocumentName" TEXT,
ADD COLUMN "sourceDocumentSize" INTEGER,
ADD COLUMN "sourceDocumentContentType" TEXT;
