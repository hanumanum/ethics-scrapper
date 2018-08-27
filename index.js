const scrapper = require("./scrapper");


scrapper.scrappPerson("http://ethics.am/hy/declarations-registry/user_id=270/" , function(person){
    console.log(person);
})