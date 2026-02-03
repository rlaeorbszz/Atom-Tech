import express from "express";
import path from "path";
import mongoose from "mongoose";
import methodOverride from "method-override";
import Business from "./models/business.js";
import Review from "./models/review.js";
import { fileURLToPath } from 'url';


const url = 'mongodb+srv://db_user:Dbdb1122@cluster0.guxh1eb.mongodb.net/yelpclone?retryWrites=true&w=majority'

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
    const business = await Business.findById(req.params.id);
    console.log(business);
    res.render('businesses/show', { business });
})

app.post('/business', async (req, res) => {
    const business = new Business(req.body.business);
    await business.save();
    res.redirect(`/business/${business._id}`);
});


app.listen(3000, () => {
    console.log('Serving on port 3000')
})