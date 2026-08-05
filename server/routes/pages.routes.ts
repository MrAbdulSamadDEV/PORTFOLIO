import { Router } from "express";
import { contactPage, homePage, notFoundPage, projectsPage } from "../controllers/pages.controller.js";

export const pagesRouter = Router();

pagesRouter.get("/", homePage);
pagesRouter.get("/projects", projectsPage);
pagesRouter.get("/contact", contactPage);

/** Every unmatched path receives a proper 404 page with a 404 status. */
pagesRouter.use(notFoundPage);
