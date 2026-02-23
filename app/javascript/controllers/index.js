import { Application } from "@hotwired/stimulus";
import FlashController from "./flash_controller";
import TopicEditorController from "./topic_editor_controller";

const application = Application.start();
application.register("flash", FlashController);
application.register("topic-editor", TopicEditorController);

export { application };
