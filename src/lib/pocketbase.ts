import PocketBase from "pocketbase";

const pb = new PocketBase("https://kstuformat.pockethost.io");
pb.autoCancellation(false);
export { pb };
