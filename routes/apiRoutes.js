const express = require("express")
const app = express()

const userRoutes = require("./user")
const authRoutes = require("./authRoute")
const commentRoutes = require("./comment")
const postRoutes = require("./post")
const messengerRoutes = require("./messengerRoute")


const productRoutes = require("./product")
const E_categoryRoutes = require("./E_category")
const orderRoutes = require("./orderRoute")
const categoryRoutes = require("./category")
const { isAuth, isASubscriber } = require("../middlewares/auth")
const { currentUser } = require("../controllers/user")





app.use("/auth", authRoutes) // done
app.use("/users", userRoutes) //done
app.use("/post", postRoutes) //done
app.use("/category", categoryRoutes) //done
app.use("/comment", commentRoutes) //done
app.use("/messenger", messengerRoutes) //done


app.use("/products", productRoutes) //done
app.use("/orders", orderRoutes) //done
app.use("/categories", E_categoryRoutes) //done


app.use("/subscriber", isAuth, isASubscriber, currentUser);

app.use("/is-auth", isAuth, (req, res) => {
    const { user } = req;
    res.json({
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        picture: user.picture,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        isAdmin: user.isAdmin
      },
    });
  });

module.exports = app