import { Application } from "@hotwired/stimulus";
import FlashController from "./flash_controller";
import TopicEditorController from "./topic_editor_controller";
import UserIconController from "./user_icon_controller";
import TestController from "./test_controller";

const application = Application.start();
application.register("flash", FlashController);
application.register("topic-editor", TopicEditorController);
application.register("user-icon", UserIconController);
application.register("test", TestController);

export { application };
