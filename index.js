const scrapper = require("./scrapper");

/*
scrapper.scrappPerson("http://www.ethics.am/hy/declarations-registry/user_id=468/" , function(person){
    console.log(person);
})
*/


scrapper.scrappDeclacation("http://www.ethics.am/hy/declarations-registry/id=26123/",function(declaration){
    console.log(declaration);
})

