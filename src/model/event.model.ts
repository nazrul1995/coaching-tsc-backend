import { model, Schema } from "mongoose";
import { TEVent } from "../types/event.interface";

const eventScema = new Schema<TEVent> ({
    title: {type: String, required: true},
    description: {type: String, required: true},
    date : {type:Date, required : true},
    location: {type: String, required: true},
    organizer: {type: String, required: true},
    image: String
 },
 {
    timestamps: true
 }
)
export const Event = model<TEVent>('Event', eventScema)