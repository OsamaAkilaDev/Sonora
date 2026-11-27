-- Full-text search over message bodies. External-content FTS5 index kept in sync by triggers.
-- unicode61 + remove_diacritics: case/diacritic-insensitive, and tokenizes Arabic script.
CREATE VIRTUAL TABLE `messages_fts` USING fts5(body, content='messages', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
--> statement-breakpoint
INSERT INTO `messages_fts`(rowid, body) SELECT rowid, body FROM `messages`;
--> statement-breakpoint
CREATE TRIGGER `messages_fts_ai` AFTER INSERT ON `messages` BEGIN
  INSERT INTO `messages_fts`(rowid, body) VALUES (new.rowid, new.body);
END;
--> statement-breakpoint
CREATE TRIGGER `messages_fts_ad` AFTER DELETE ON `messages` BEGIN
  INSERT INTO `messages_fts`(`messages_fts`, rowid, body) VALUES ('delete', old.rowid, old.body);
END;
--> statement-breakpoint
CREATE TRIGGER `messages_fts_au` AFTER UPDATE OF body ON `messages` BEGIN
  INSERT INTO `messages_fts`(`messages_fts`, rowid, body) VALUES ('delete', old.rowid, old.body);
  INSERT INTO `messages_fts`(rowid, body) VALUES (new.rowid, new.body);
END;
