import React from 'react';
import AccessControl from './AccessControl';
import WebSocketToken from './WebSocketToken';


function Security({accessControl, setAccessControl}) {
  return (
    <>
        <AccessControl
            accessControl={accessControl}
            setAccessControl={setAccessControl}
        />
        <WebSocketToken />
    </>
  );
}

export default Security;
