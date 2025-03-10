const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

////////////////////////////////////////////////
// helper function                            //
////////////////////////////////////////////////

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function dishIdMatches(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id || id === dishId) {
    next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      //   console.log("=========================");
      //   console.log("data[propertyName]: ", data[propertyName]);
      //   console.log("value is not empty");
      return next();
    }
    next({
      status: 400,
      message: `Dish must include ${propertyName}`,
    });
  };
}

function isPriceValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  //   console.log("price: ", price, typeof price);
  if (price > 0 && Number.isInteger(price)) {
    // console.log("truthy case");
    return next();
  }
  //   console.log("falthy case");
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

////////////////////////////////////////////////
// main function                              //
////////////////////////////////////////////////

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const dish = res.locals.dish;

  const { data } = req.body;
  const { name, description, price, image_url } = data;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

// dishes cannot be deleted

module.exports = {
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    dishIdMatches,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    isPriceValid,
    update,
  ],
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    isPriceValid,
    create,
  ],
};
