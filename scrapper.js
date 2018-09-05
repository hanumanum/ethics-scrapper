const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrappPerson:function(url, next){
        let person = {
            fName:"",
            mName:"",
            lName:"",
            currentPositionTitle:"",
            currentPositionFrom:"",
            source:url,
            reportsList:[],
            relatedPersonsList:[]
        }
        request(url, function(error, response, html){
            if(!error){
                let $ = cheerio.load(html);
                let fullName = $(".pers-title .pers-fullname").first().text().split(" ");
                person.fName =  fullName[0];
                person.mName =  fullName[1];
                person.lName =  fullName[2];
                
                let m =  $(".pers-title").contents()
                    .filter(function() {
                        return this.nodeType === 3; //Node.TEXT_NODE
                });

                person.currentPositionTitle = $(".pers-title strong").first().text();
                person.currentPositionFrom =  m[3].data.split(" ")[0]; //TODO; Check index 3 for other pages 
                
                //Reports
                let reportsList = $("#content ul").first();
                let regexForYear = /\(([^)]+)\)/;
                reportsList.children().each(function(index, rep){
                    person.reportsList.push({
                        "reportLink":$(rep).find("a").prop("href"),
                        "reportTitle":$(rep).find("a").text(),
                        "reportPosition":$(rep).text().split("\n\t\t")[1],
                        "reportYear":regexForYear.exec($(rep).find("a").text())[1]
                    })
                })


                //Relation Declarations
                $("#relations-decl > tbody >tr").each(function(index, relatedPerson){
                    let tdsInrow = $(relatedPerson).find("td");
                    if(tdsInrow[0]){  //for first row eg. table headings
                        let fullName = $(tdsInrow[0]).text().split(" ");
                        let relationDeclarations = [];
                        
                        $(tdsInrow[2]).find("ul>li>a").each(function(index,link){
                            relationDeclarations.push(
                                {"reportLink":$(link).prop("href"),
                                 "reportTitle":$(link).text()
                                }
                            )
                        })
                        
                        person.relatedPersonsList.push(
                        {
                            fName:fullName[0],
                            mName:fullName[1],
                            lName:fullName[2],
                            relationType:$(tdsInrow[1]).text(),
                            relationDeclarations:relationDeclarations
                        })
                    }
                    
                });

                next(person);
            }
        })
    }

    ,scrappDeclacation:function(url, next){

        let declaration = {
            docTitle:"",
            year:"",
            source:url,
            table1:[],  //անշարժ գույքը
            table2:[],  //շարժական գույքը
            table3:[],  //արժեթղթերը
            table4:[],  //փոխառությունները
            table5:[],  //թանկարժեք գույքը
            table6:[],  //դրամական միջոցները
            table7:[]   //եկամուտները հարկային տարում
        }
        request(url, function(error, response, html){
            if(!error){
                let $ = cheerio.load(html);
                declaration.docTitle=$(".ttl").first().text().toLocaleLowerCase();
                
                let tables = $(".tbl.mcol")
                                          
                //1st Data Table //ձեռքբերած և օտարած անշարժ գույքը
                let table1 = $(tables).eq(2).find("tr"); 
                table1.each(function(index,tr){
                    if(index>3 && !isCaption(extractFromTR($,tr,0))){               //Avoide table's headers
                        declaration.table1.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                existsAtStart:formatYesNo(extractFromTR($,tr,3)),
                                acquiredValue:formatMoney(extractFromTR($,tr,4)),
                                acquiredCurrency:remNl(extractFromTR($,tr,5)),
                                removedValue:formatMoney(extractFromTR($,tr,6)),
                                removedCurrency:remNl(extractFromTR($,tr,7)),
                                existsAtEnd:formatYesNo(extractFromTR($,tr,8)),
                            }
                        )
                    }
                    
                });

               
                //2th data table //շարժական գույքը
                let table2 = $(tables).eq(3).find("tr");
                table2.each(function(index,tr){
                    if(index>2 && !isCaption(extractFromTR($,tr,0))){//Avoide table's headers
                        declaration.table2.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                serie:remNl(extractFromTR($,tr,2)),
                                existsAtStart:formatYesNo(extractFromTR($,tr,3)),
                                acquiredValue:formatMoney(extractFromTR($,tr,4)),
                                acquiredCurrency:remNl(extractFromTR($,tr,5)),
                                removedValue:formatMoney(extractFromTR($,tr,6)),
                                removedCurrency:remNl(extractFromTR($,tr,7)),
                                existsAtEnd:formatYesNo(extractFromTR($,tr,8)),
                            }
                        )
                    }
                    
                });



                //4th data table //արժեթղթերը
                let table3 = $(tables).eq(4).find("tr");
                table3.each(function(index,tr){
                    if(index>2 && !isCaption(extractFromTR($,tr,0))){//Avoide table's headers
                        declaration.table3.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                currency:extractFromTR($,tr,2),
                                startValue:formatMoney(extractFromTR($,tr,3)),
                                acquiredValue:formatMoney(extractFromTR($,tr,4)),
                                removedValue:formatMoney(extractFromTR($,tr,5)),
                                endValue:formatMoney(extractFromTR($,tr,6)),
                            }
                        )
                    }
                    
                });

                //4th data table //փոխառությունները
                let table4 = $(tables).eq(5).find("tr");
                table4.each(function(index,tr){
                    if(index>1 && !isCaption(extractFromTR($,tr,0))){//Avoide table's headers
                        declaration.table4.push(
                            {
                                nn:extractFromTR($,tr,0),
                                currency:extractFromTR($,tr,3),
                                valueStart:formatMoney(extractFromTR($,tr,4)),
                                givedValue:formatMoney(extractFromTR($,tr,5)),
                                returnedValue:formatMoney(extractFromTR($,tr,6)),
                                valueEnd:formatMoney(extractFromTR($,tr,7)),
                            }
                        )
                    }
                    
                });


                //5th data table //թանկարժեք գույքը
                let table5 = $(tables).eq(6).find("tr");
                table5.each(function(index,tr){
                    if(index>2 && !isCaption(extractFromTR($,tr,0))){//Avoide table's headers
                        declaration.table5.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                existsAtStart:formatYesNo(extractFromTR($,tr,2)),
                                acquiredValue:formatMoney(extractFromTR($,tr,3)),
                                acquiredCurrency:remNl(extractFromTR($,tr,4)),
                                removedValue:formatMoney(extractFromTR($,tr,5)),
                                removedCurrency:remNl(extractFromTR($,tr,6)),
                                existsAtEnd:formatYesNo(extractFromTR($,tr,7)),
                
                            }
                        )
                    }
                });


                //6th data table //դրամական միջոցները
                let table6 = $(tables).eq(7).find("tr");
                table6.each(function(index,tr){
                    if(index>1 && !isCaption(extractFromTR($,tr,0))){//Avoide table's headers
                        declaration.table6.push(
                            {
                                nn:extractFromTR($,tr,0),
                                currency:remNl(extractFromTR($,tr,1)),
                                valueStart:formatMoney(extractFromTR($,tr,2)),
                                valueEnd:formatMoney(extractFromTR($,tr,3))
                            }
                        )
                    }
                });

                //7th data table //եկամուտները
                let table7 = $(tables).eq(8).find("tr");
                table7.each(function(index,tr){
                    if(index>2 && !isCaption(extractFromTR($,tr,0))){//Avoide table's headers
                        declaration.table7.push(
                            {
                                nn:extractFromTR($,tr,0),
                                title:remNl(extractFromTR($,tr,1)),
                                currency:remNl(extractFromTR($,tr,4)),
                                incomeAMD:formatMoney(extractFromTR($,tr,5)),
                                incomeForign:formatMoney(extractFromTR($,tr,6)),
                                incomeNature:formatMoney(extractFromTR($,tr,7))
                            }
                        )
                    }
                });

                next(declaration);
            }
        })
    }


}


function extractFromTR($,tr,index){
    return $($(tr).find("td")[index]).text()
    
}


function formatMoney(amount){
    return amount.trim()
                  .split(",")
                  .join("")
}


function formatYesNo(data){
    return (data=="ԱՅՈ")? true:false
}

function remNl(data){
    return data.replace("\n", "");
}

function isCaption(data){
    return data.indexOf("Տվյալներ չկան")>-1 || data.indexOf("Ընդամենը")>-1;
}
