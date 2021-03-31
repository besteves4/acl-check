const $rdf = require('rdflib')
const aclCheck = require('./acl-check')
const ACL = $rdf.Namespace('http://www.w3.org/ns/auth/acl#')

const kb = $rdf.graph()
const fetcher = $rdf.fetcher(kb)

let doc = $rdf.sym('https://beatrizesteves.solidcommunity.net/robots.txt')
let aclDoc = $rdf.sym('https://beatrizesteves.solidcommunity.net/robots.txt.acl')
let directory = $rdf.sym('https://alice.example.com/stuff/')
let dirAclDoc = $rdf.sym('https://alice.example.com/stuff/')

let agent = $rdf.sym('https://beatrizesteves.solidcommunity.net/profile/card#me')
let modesRequired = [ ACL('Read'), ACL('Write'), ACL('Control') ]

//await fetcher.load(aclDoc) // Load the ACL documents into kb
fetcher.load(aclDoc)

let allow = aclCheck.checkAccess(kb, doc, null, aclDoc, agent, modesRequired, origin, trustedOrigins)

// When there is no direct ACL file, find the closest container ACL file in the tree above then...
//await fetcher.load(dirAclDoc) // Load the directory ACL documents into kb
//let allow = aclCheck.checkAccess(kb, resource, directory, dirAclDoc, agent, modesRequired, origin, trustedOrigins)

console.log('Access allowed? ' + allow)
// OWTTE
