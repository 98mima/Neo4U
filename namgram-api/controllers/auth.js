const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));
const { registerValidation, loginValidation } = require('../validation');
const uuid = require('node-uuid');
const _ = require('lodash');

let session = driver.session();

exports.register = async (req, res, next) => {
  const { error } = registerValidation(req.body);
  if (error)
    return res.status(400).send(error.details[0].message)

  const emailExist = await session.run('MATCH (n:Person {email: $email}) RETURN n', {
    email: req.body.email
  })
  const usernameExist = await session.run('MATCH (n:Person {username: $username}) RETURN n', {
    username: req.body.username
  })
  if (!_.isEmpty(emailExist.records) || !_.isEmpty(usernameExist.records)) {
    return res.status(401).send('Korisnik sa takvim mejlom ili username-om vec postoji: ' + req.body.email + ' ' + req.body.username);
  }
  const salt = await bcryptjs.genSalt(10);
  const hashPassword = await bcryptjs.hash(req.body.password, salt);

  try {
    const person = await session.run('CREATE (person:Person {id: $id, name: $name, lastname: $lastname, username: $username, email: $email, birthday: $birthday, password: $password}) RETURN person', {
      id: uuid.v4(),
      name: req.body.name,
      lastname: req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      birthday: req.body.birthday,
      password: hashPassword
    })
    const dbPerson = (person.records[0].get('person'))
    const token = jwt.sign({ id: dbPerson.properties.id }, process.env.TOKEN);
    res.json({
      Success: true,
      AuthToken: token
    });
  } catch (err) {
    res.status(401).send(err);
    console.log(err)
  }
}

exports.login = async (req, res, next) => {
  const { error } = loginValidation(req.body);
  if (error)
    return res.status(400).send(error.details[0].message);

  const userExist = await session.run('MATCH (person:Person {email: $email}) RETURN person', {
    email: req.body.email
  });

  if (_.isEmpty(userExist.records))
    return res.status(401).send('Wrong email');

  const dbPerson = (userExist.records[0].get('person'))

  const validPassword = await bcryptjs.compare(req.body.password, dbPerson.properties.password);
  if (!validPassword)
    return res.status(401).send('Wrong Password');

  const token = jwt.sign({
    id: dbPerson.properties.id,
    username: dbPerson.properties.username,
    email: dbPerson.properties.email,
    birthday: dbPerson.properties.birthday,
    name: dbPerson.properties.name,
    lastname: dbPerson.properties.lastname,
  }, process.env.TOKEN);
  res.json({ AuthToken: token, Success: true });
}

exports.checkPassword = (password, hash) => {
  return bcryptjs.compareSync(password.toString(), hash)
}


