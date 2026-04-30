CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"kcId" uuid NOT NULL,
	"refreshToken" varchar,
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "kcId_idx" ON "users" USING btree ("kcId");