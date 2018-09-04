// Access control logic

const $rdf = require('rdflib')

const ACL = $rdf.Namespace('http://www.w3.org/ns/auth/acl#')
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/')
const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#')

module.exports = {}

function publisherTrustedApp (kb, doc, aclDoc, modesRequired, origin, docAuths) {
  let app = $rdf.sym(origin)
  let appAuths = docAuths.filter(auth => kb.holds(auth, ACL('mode'), ACL('Control'), aclDoc))
  let owners = appAuths.map(auth => kb.each(auth, ACL('agent'))).flat() //  owners
  let relevant = owners.map(owner => kb.each(owner, ACL('trust'), null, owner.doc()).filter(
    ta => kb.holds(ta, ACL('trustedApp'), app, owner.doc()))).flat() // ta's
  let modesOK = relevant.map(ta => kb.each(ta, ACL('mode'))).flat().map(m => m.uri)
  let modesRequiredURIs = modesRequired.map(m => m.uri)
  modesRequiredURIs.every(uri => modesOK.includes(uri))
  // modesRequired.every(mode => appAuths.some(auth => kb.holds(auth, ACL('mode'), mode, aclDoc)))
}

function checkAccess (kb, doc, directory, aclDoc, agent, modesRequired, origin, trustedOrigins) {
  var auths = kb.each(null, ACL('accessTo'), doc, aclDoc)
  console.log(`checkAccess: checking access to ${doc} by ${agent}`)
  if (auths.length) console.log(`   ${auths.length} authentications apply directly to doc`)
  if (directory) {
    auths = auths.concat(null, (ACL('defaultForNew'), directory)) // Deprecated but keep for ages
    auths = auths.concat(null, (ACL('default'), directory))
    if (auths.length) console.log(`   ${auths.length} total relevant authentications`)
  }
  if (origin && trustedOrigins && trustedOrigins.includes(origin)) {
    console.log('Origin ' + origin + ' is trusted')
    origin = null // stop worrying about origin
    console.log(`  checkAccess: Origin ${origin} is trusted.`)
  }
  function agentOrGroupOK (auth, agent) {
    console.log(`   Checking auth ${auth} with agent ${agent}`)
    if (kb.holds(auth, ACL('accessToClass'), FOAF('Agent'), aclDoc)) {
      console.log(`    Agent or group: Ok, its public.`)
      return true
    }
    if (!agent) {
      console.log(`    Agent or group: Fail: not public and not logged on.`)
      return false
    }
    if (kb.holds(auth, ACL('accessToClass'), ACL('AuthenticatedAgent'), aclDoc)) {
      console.log('    AuthenticatedAgent: logged in, looks good')
      return true
    }
    if (kb.holds(auth, ACL('agent'), agent, aclDoc) ) {
      console.log('    Agent explicitly authenticated.')
      return true
    }
    if (kb.each(auth, ACL('accessToGroup'), null, aclDoc).some(
      group => kb.holds(agent, VCARD('member'), group, group.doc()))) {
      console.log('    Agent is member of group which has accees.')
      return true
    }
    console.log('    Agent or group access fails for this authentication.')
    return false
  } // Agent or group

  function originOK (auth, origin) {
    return kb.holds(auth, ACL('origin'), origin, aclDoc)
  }
  let allowed = modesRequired.every(mode => {
    console.log(' Checking needed mode ' + mode)
    let modeAuths = auths.filter(auth => kb.holds(auth, ACL('mode'), mode, aclDoc))
    if (mode.sameTerm(ACL('Append'))) { // If you want append, Write will work too.
      let writeAuths = auths.filter(auth => kb.holds(auth, ACL('mode'), ACL('Write'), aclDoc))
      console.log(`   Authorizations that work with Write: ${writeAuths.length}`)
      modeAuths = modeAuths.concat(writeAuths)
    }
    console.log(`   Authorizations that work with mode: ${modeAuths.length}`)
    let modeResult = modeAuths.some(auth => {
      if (!agentOrGroupOK(auth, agent)) {
        console.log('     The agent/group/public check fails')
        return false
      }
      if (!origin) {
        console.log('     Origin check not needed: no origin.')
        return true
      }
      if (originOK(auth, origin)) {
        console.log('     Origin check succeeded.')
        return true
      }
      console.log('     Origin check FAILED. Origin not tested.')
      return true
    })
    console.log(' Mode result ' + modeResult)
    return modeResult
  })
  console.log('Overall result:' + allowed)
  return allowed
}

module.exports.checkAccess = checkAccess
module.exports.publisherTrustedApp = publisherTrustedApp
