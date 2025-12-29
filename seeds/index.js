import mongoose from 'mongoose';
import cities from './cities.js';
import Business from "../models/business.js";
import { descriptors, places } from './seedHelpers.js';

const url = 'mongodb+srv://yelpclone1:yelpclone1@cluster0.tnyqubr.mongodb.net/yelpclone1?retryWrites=true&w=majority'

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Business.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const business = new Business({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`
        })
        await business.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})