const $rdf = require('rdflib')
const aclCheck = require('./acl-check')
const ACL = $rdf.Namespace('http://www.w3.org/ns/auth/acl#')

const kb = $rdf.graph()
const fetcher = $rdf.fetcher(kb)

let doc = $rdf.sym('https://beatrizesteves.solidcommunity.net/robots.txt')
let aclDoc = $rdf.sym('https://beatrizesteves.solidcommunity.net/robots.txt.acl')
let directory = $rdf.sym('https://beatrizesteves.solidcommunity.net/')
let dirAclDoc = $rdf.sym('https://beatrizesteves.solidcommunity.net/')

let agent = $rdf.sym('https://beatrizesteves.solidcommunity.net/profile/card#me')
let modesRequired = [ ACL('Read'), ACL('Write'), ACL('Control') ]

let origin = null
let trustedOrigins = null

fetcher.load(aclDoc) // Load the ACL documents into kb

let allow = aclCheck.checkAccess(kb, doc, null, aclDoc, agent, modesRequired, origin, trustedOrigins)

// When there is no direct ACL file, find the closest container ACL file in the tree above then...
fetcher.load(dirAclDoc) // Load the directory ACL documents into kb
//let allow = aclCheck.checkAccess(kb, doc, directory, dirAclDoc, agent, modesRequired, origin, trustedOrigins)

console.log('Access allowed? ' + allow)
