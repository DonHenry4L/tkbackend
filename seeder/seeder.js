require("dotenv").config()

const connectDB = require("../config/db")
connectDB()

const categoryData = require("./categories")
const productData = require("./products")
const reviewData = require("./reviews")
const orderData = require("./orders")

const Category = require("../models/category")
const Product = require("../models/product")
const Review = require("../models/Review")
const Order = require("../models/OrderModel")

const importData = async () => {
    try {
        await Category.collection.dropIndexes()
        await Product.collection.dropIndexes()

        await Category.collection.deleteMany({})
        await Product.collection.deleteMany({})
        await Review.collection.deleteMany({})
        await Order.collection.deleteMany({})

        await Category.insertMany(categoryData)
        const reviews = await Review.insertMany(reviewData)
        const sampleProducts = productData.map((product) => {
            reviews.map((review) => {
                product.reviews.push(review._id)
            })
            return {...product}
        })
        await Product.insertMany(sampleProducts)
        await Order.insertMany(orderData)

        console.log("Seeder data proceeded successfully")
        process.exit()
    } catch (error) {
        console.error("Error while processing seeder data", error)
        process.exit(1);
    }
}
importData()
 
