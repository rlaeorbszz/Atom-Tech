import express from "express";
import path from "path";
import mongoose from "mongoose";
import methodOverride from "method-override";
import Business from "./models/business.js";
import Review from "./models/review.js";
import { fileURLToPath } from 'url';


const url = '/yelpclone?retryWrites=true&w=majority'

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
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
   
    const business = await Business.findById(req.params.id);
    
    
    const review = new Review(req.body.review);
                       
    
    business.reviews.push(review);
     
   
    await review.save();
    await business.save();
    
  
    res.redirect(`/business/${business._id}`);
});

// DELETE a review: remove from Business.reviews and delete Review doc
app.delete('/business/:id/reviews/:reviewId', async (req, res) => {
    const { id, reviewId } = req.params;
    // Remove the review id from the business' reviews array
    await Business.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    // Delete the review document itself
    await Review.findByIdAndDelete(reviewId);
    // Redirect back to the business show page
    res.redirect(`/business/${id}`);
});


app.listen(3000, () => {
        console.log('Serving on port 3000')
})