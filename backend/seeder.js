import dotenv from 'dotenv';
import colors from 'colors';
import users from './data/users.js';
import products from './data/products.js';
import User from './models/UserModel.js';
import Product from './models/ProductModel.js';
import Order from './models/OrderModel.js';
import Class from './models/ClassModel.js';
import School from './models/SchoolModel.js';
import Cart from './models/CartModel.js';
import classes from './data/classes.js';
import ProductType from './models/ProductTypesModel.js';
import productType from './Data/productType.js';
import schools from './Data/schools.js';
import home from './Data/homepage.js';
import Homepage from './models/HomepageModel.js';
import connectDB from './config/db.js';

// import { ShirtSize } from './models/SizeModel.js';
// import Size from './data/Sizes.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Class.deleteMany();
    await Cart.deleteMany();
    await ProductType.deleteMany();
    await School.deleteMany();
    await Homepage.deleteMany();

    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    const sampleProducts = products.map((product) => {
      return { ...product, user: adminUser };
    });
    const schoolsList = schools.map((school) => {
      return { ...school, user: adminUser };
    });
    await School.insertMany(schoolsList);
    await Product.insertMany(sampleProducts);
    await Class.insertMany(classes);
    await ProductType.insertMany(productType);
    await Homepage.insertMany(home);
    // console.log(productType);
    // console.log(products);
    // const firstProduct = insertedProducts[0]._id;
    // const sampleSizes = Size.map((size) => {
    //   return { ...size, user: adminUser, product: firstProduct };
    // });
    // await ShirtSize.insertMany(sampleSizes);
    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Class.deleteMany();
    await Cart.deleteMany();
    await ProductType.deleteMany();
    await School.deleteMany();
    await Homepage.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
