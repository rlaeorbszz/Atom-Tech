import mongoose from "mongoose";
const Schema = mongoose.Schema;

const BusinessSchema = new Schema ({
    title: String,
    description: String,
    location: String,
    reviews : [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    averageRating: {
        type: Number,
        default: 0
    }
});


const Business = mongoose.model('Business', BusinessSchema);
export default Business;
