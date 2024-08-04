import { unlinkSync } from "node:fs";
import { Request, Response, NextFunction } from "express";

export async function temporaryFileRemover(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  async function asyncUnlink(path: string) {
    unlinkSync(path);
  }

  // After res is closed
  res.on("close", () => {
    // Removing on req.file
    if (typeof req.file != "undefined") {
      let file = req.file;
      asyncUnlink(file.path).catch(() =>
        console.error(`Failed to remove ${file.path}`),
      );
    }

    // Removing req.files
    const files = req.files;
    if (typeof files != "undefined") {
      // On Express.Multer.File[]
      if (Array.isArray(files)) {
        files.forEach((file) => {
          asyncUnlink(file.path).catch(() =>
            console.log(`Failed to remove ${file.path}`),
          );
        });
      } else {
        // On { [fieldname: string]: Express.Multer.File[] }
        let keys = Object.keys(files);
        keys.forEach((key) => {
          let keyFiles = files[key];
          if (Array.isArray(keyFiles)) {
            keyFiles.forEach((file) => {
              asyncUnlink(file.path).catch(() =>
                console.log(`Failed to remove ${file.path}`),
              );
            });
          }
        });
      }
    }
  });

  next();
}
