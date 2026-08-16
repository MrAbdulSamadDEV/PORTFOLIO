import { Router } from "express";
import { homePage, notFoundPage } from "../controllers/pages.controller.js";

export const pagesRouter = Router();

/**
 * The site is a single-page portfolio: Projects and Contact are sections
 * of the home page. Legacy URLs redirect to their sections so bookmarks,
 * shares and search results keep working.
 */
pagesRouter.get("/", homePage);

/** Every unmatched path receives a proper 404 page with a 404 status. */
pagesRouter.use(notFoundPage);
