import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import mongoose from "mongoose";
import methodOverride from "method-override";
import OpenAI from "openai";
import Business from "./models/business.js";
import Review from "./models/review.js";
import { fileURLToPath } from 'url';

const url = process.env.MONGO_URL;
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const app = express();

app.set("view engine", "ejs");

//default directory
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());


app.get('/', (req, res) => {
    res.render('home')

});

app.get('/business', async(req, res) => {
    const business = await Business.find({});
    console.log(business);
    res.render('businesses/index', { business });
})

app.get('/business/new', (req, res) => {
    res.render('businesses/new');
})

app.get('/business/:id/update', async (req, res) => {
    const business = await Business.findById(req.params.id);
    res.render('businesses/update', { business });
})

app.put('/business/:id', async (req, res) => {
  const { id } = req.params;
  await Business.findByIdAndUpdate(id, req.body.business);
  res.redirect(`/business/${id}`);
});

app.delete('/business/:id', async (req, res) => {
  const { id } = req.params;
  await Business.findByIdAndDelete(id);
  res.redirect('/business');
});


app.get('/business/:id', async (req, res) => {
    const business = await Business.findById(req.params.id).populate('reviews');
    console.log(business);
    res.render('businesses/show', { business });
})

app.post('/business', async (req, res) => {
    const business = new Business(req.body.business);
    await business.save();
    res.redirect(`/business/${business._id}`);
});

app.post('/business/:id/reviews', async (req, res) => {
   
    const business = await Business.findById(req.params.id).populate('reviews');
    
    
    const review = new Review(req.body.review);
                       
    
    business.reviews.push(review);
     
   
    await review.save();
    
    // Calculate average rating
    let totalRating = 0;
    for (let r of business.reviews) {
        totalRating += r.rating;
    }
    business.averageRating = parseFloat((totalRating / business.reviews.length).toFixed(2));
    
    await business.save();
  
    res.redirect(`/business/${business._id}`);
});

app.post('/business/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        const message = req.body.message?.trim();

        if (!message) {
            return res.status(400).json({ reply: "Please enter a message." });
        }

        const business = await Business.findById(id).populate('reviews');
        if (!business) {
            return res.status(404).json({ reply: "Business not found." });
        }

        const reviewsText = business.reviews.length
            ? business.reviews
                .map((review) => `Rating: ${review.rating}/5, Review: ${review.body}`)
                .join("\n")
            : "No reviews yet.";

        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content: "You are a friendly assistant for one business page. Keep answers short and polite. Base answers only on the provided business details and reviews. If the answer is not in the provided data, say you do not have that information."
                },
                {
                    role: "user",
                    content: `Business title: ${business.title}\nLocation: ${business.location}\nDescription: ${business.description}\nAverage rating: ${business.averageRating}\nReviews:\n${reviewsText}\n\nUser question: ${message}`
                }
            ]
        });

        res.json({ reply: response.output_text || "I do not have a response right now." });
    } catch (error) {
        console.error("OpenAI chat error:", error);
        res.status(500).json({ reply: "Something went wrong while contacting AI Buddy." });
    }
});

// DELETE a review: remove from Business.reviews and delete Review doc
app.delete('/business/:id/reviews/:reviewId', async (req, res) => {
    const { id, reviewId } = req.params;
    // Remove the review id from the business' reviews array
    await Business.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    // Delete the review document itself
    await Review.findByIdAndDelete(reviewId);
    
    // Recalculate average rating
    const business = await Business.findById(id).populate('reviews');
    if (business.reviews.length > 0) {
        let totalRating = 0;
        for (let r of business.reviews) {
            totalRating += r.rating;
        }
        business.averageRating = parseFloat((totalRating / business.reviews.length).toFixed(2));
    } else {
        business.averageRating = 0;
    }
    await business.save();
    
    // Redirect back to the business show page
    res.redirect(`/business/${id}`);
});


app.listen(3000, () => {
        console.log('Serving on port 3000')
})
