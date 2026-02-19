import { Application } from "@hotwired/stimulus";
import FlashController from "./flash_controller";

const application = Application.start();
application.register("flash", FlashController);

export { application };
