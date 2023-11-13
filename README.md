# StatefulSets
StatefulSets in Kubernetes is a workload API that oversees the deployment and scaling of a set of Pods while preserving stickiness to persistent storage and guaranteeing order and uniqueness. Through StatefulSets, each Pod receives a stable, unique identifier, maintaining predictable and orderly deployment, which is indispensable for the seamless operation of stateful applications

![image](https://github.com/vamshii7/StatefulSets/assets/48650579/b39fd6eb-1c62-4cd3-8c9c-2cc7dbf0ec74)

# Why StaefulSets ?
StatefulSets in Kubernetes offer several features that make them well-suited for managing stateful applications. Here are some key features of StatefulSets:

- **Stable Network Identifiers:**

&nbsp;&nbsp;&nbsp;&nbsp;Each pod in a StatefulSet gets a unique and stable hostname based on the StatefulSet's name and an ordinal index. This hostname remains constant across pod rescheduling.

- **Ordered Deployment:**

&nbsp;&nbsp;&nbsp;&nbsp;Pods are created and updated in a specified order. Each pod is started only after the previous one is Running and Ready.

- **Stable Storage:**

&nbsp;&nbsp;&nbsp;&nbsp;StatefulSets work well with Persistent Volumes (PVs) and Persistent Volume Claims (PVCs), ensuring that each pod has its own persistent storage. This is crucial for stateful applications like databases.

- **Headless Service:**

&nbsp;&nbsp;&nbsp;&nbsp;StatefulSets are commonly associated with a Headless Service that allows pods to be discovered using DNS names. This enables stable and consistent network communication between pods.

- **Scaling:**

&nbsp;&nbsp;&nbsp;&nbsp;StatefulSets support scaling operations, allowing you to scale the number of replicas up or down. New pods are created with their unique ordinal indices and hostnames.

# Deployments vs. StatefulSets

The following table covers the differences between Deployments and StatefulSets:  

| **Deployments**| **StatefulSets** |
| -------- | -------- | 
| Deployments are used for deploying stateless applications.   | StatefulSets are used for deploying stateful applications.   | 
| Pods created by Deployments are identical and interchangeable.   | Pods created by StatefulSets are not interchangeable because each Pod is unique and possesses a stable identity that persists across rescheduling.   |  
| Pods are created in parallel with random hashes in their names.   | Pods are created in a specific order with fixed names, hostnames, and ordinal indexes that can be used to access them.   | 
| Deployments require a service to communicate with Pods, and requests are load-balanced across multiple Pod replicas.   | StatefulSets require a headless service to handle the communication between Pods without load balancing.   |  
| In a Deployment, all Pods share the same persistent volume claims (PVC), which means that the same persistent volume (PV) is used in all containers.   | In a StatefulSet, each Pod has a different PVC, which means each Pod uses a different PV.   | 
| When a Deployment is deleted, Pods are deleted randomly.   | When a StatefulSet is deleted, Pods are deleted in the reverse order.   |  

# When to Use StatefulSets

There are several reasons to consider using StatefulSets. Here are two examples:

- &nbsp;&nbsp;Assume you deployed a MySQL database in the Kubernetes cluster and scaled this to three replicas, and a frontend application wants to access the MySQL cluster to read and write data. The read request will be forwarded to three Pods. However, the write request will only be forwarded to the first (primary) Pod, and the data will be synced with the other Pods. You can achieve this by using StatefulSets.
  
- &nbsp;&nbsp;Deleting or scaling down a StatefulSet will not delete the volumes associated with the stateful application. This gives you your data safety. If you delete the MySQL Pod or if the MySQL Pod restarts, you can have access to the data in the same volume.

# Deploy a PersistentVolumeClaim

Before you can start working with StatefulSets, persistent volumes must be created in your Kubernetes cluster. They can be either statically or dynamically provisioned. Static persistent volumes are manually created by admins, whereas dynamic persistent volumes are automatically created based on a StorageClass. 

```A StorageClass is a Kubernetes resource that allows admins to define different types of storage in a Kubernetes cluster. It helps in automatic storage provisioning by allowing users to request a specific type of storage without knowing the details of the underlying storage system.```

Below YAML file represents a Kubernetes resource definition for a PersistentVolumeClaim (PVC). A PersistentVolumeClaim is used by applications to request storage resources in a Kubernetes cluster.
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-storage
spec:
  accessModes:
    - ReadWriteOnce
  persistentVolumeClaimRetentionPolicy:
    whenDeleted: Retain
    whenScaled: Delete
  resources:
    requests:
      storage: 1Gi
```
this YAML file defines a PersistentVolumeClaim named bucketlist-storage with a specified access mode, a retention policy for both deletion and scaling, and a request for 1 gigabyte of storage. This PersistentVolumeClaim can be used by applications to claim persistent storage in a Kubernetes cluster.

apply this yaml file to create a PersistentVolumeClaim

To check the persistent volumes and persistent volume claims in the Kubernetes cluster, run this command:

```
kubectl get pv,pvc
```

# Deploy a StatefulSet

```
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  replicas: 1
  serviceName: mysql-svc
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:latest  # Use the MySQL image
          env:
            - name: MYSQL_ROOT_PASSWORD
              value: "PASSWORD"  # Set a secure password
            - name: MYSQL_DATABASE
              value: "YOUR_DATABASE_NAME"  # Set the desired database name
            - name: MYSQL_USER
              value: "USERNAME"  # Set the MySQL user
            - name: MYSQL_PASSWORD
              value: "PASSWORD"  # Set a secure password for the MySQL user
          ports:
            - name: mysql-port
              protocol: TCP
              containerPort: 3306
          volumeMounts:
            - name: mysql-data
              mountPath: /var/lib/mysql  # Mount path for MySQL data
  volumeClaimTemplates:
    - metadata:
        name: mysql-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "standard"  # Set the storage class to "standard" for Google Disks
        resources:
          requests:
            storage: 1Gi
```
You can see that the configuration is similar to a Deployment, except for the kind, which is set to StatefulSet. 
apply the YAML files and watch the Pods being created:

You can see that the Pods are created in sequential order. In addition, the Pod names are assigned based on the StatefulSet name and a zero-based ordinal index separated by a dash (-) character.

# Verify sticky identity
As stated earlier, the identity of Pods managed by a StatefulSet persists across the restart or rescheduling. If a Pod is restarted or rescheduled (for any reason), the StatefulSet controller creates a new Pod with the same name. To demonstrate the sticky identity, let's delete a Pod.

```
kubectl get pods
kubectl delete pod <pod_name>
kubectl get pods -w
```
This behavior is particularly useful when you deploy a complex stateful application (e.g., a replicated instance of a MySQL database with a master–slave configuration). In this case, the master node of the MySQL cluster can be reliably predicted. Assuming the StatefulSet name is mysql, the first Pod will be named mysql-0, which can be configured as a master Pod. You can then point the slave Pods (replicas) to the stable name of the master Pod that doesn't change, even if it is rescheduled.

# View a StatefulSet

To view the StatefulSet, you can run the kubectl get statefulset and kubectl describe statefulset commands, as shown below:
```
kubectl get statefulsets -o wide
kubectl describe sts <sts-name>
```
The short name for StatefulSet is sts. The describe command shows the configuration of a StatefulSet in detail. You can also use the ```kubectl describe pod``` command to see the persistent volume claim and the mounted volume.

Remember, persistent volumes and persistent volume claims have a one-to-one relationship, which means that a persistent volume claim can only bind to one persistent volume, and a persistent volume can only be bound by one persistent volume claim. In addition, persistent volumes are not associated with any namespace. However, the persistent volume claims are namespaced, which means that a Pod and a persistent volume claim must be in the same namespace to be able to work.

# Create a headless service
You cannot use a standard configuration of a Kubernetes Service to access the Pods of a StatefulSet. This is because StatefulSet Pods are unique and non-interchangeable. With a regular service, the traffic is automatically load-balanced across different Pods, which works in the case of Deployments where Pods are interchangeable. Imagine that you are running a MySQL cluster with master–slave topology, where the first Pod is working as a master and others as slaves. In this case, you need something that communicates with individual Pods directly instead of randomly choosing a single Pod. A headless service is perfect for such a scenario. 

Let's create svc.yaml with this configuration:

```
apiVersion: v1
kind: Service
metadata:
  name: mysql-svc
spec:
  selector:
    app: mysql
  ports:
    - protocol: TCP
      port: 3306
      targetPort: mysql-port
  clusterIP: None
```

Explicitly setting the value of the clusterIP field to None makes it a headless service. The spec.selector field matches the Pod labels to identify them as service endpoints. Now, apply the svc.yaml file to create a headless service.

```
kubectl apply -f svc.yaml
kubectl get svc
```
Remember, you cannot simply rely on the IP address of a Pod, since it changes after the restart. That is why a headless service uses the DNS name of Pods to communicate, which is a stable identifier in ```<pod-name>.<headless-service-name>.<namespace>.svc.cluster.local``` format. This also means that all Pods can ping each other using their DNS names.

# Scale a StatefulSet

The StatefulSets can be scaled up and down easily, just like a Kubernetes Deployment. To manually scale a StatefulSet, you can change the replicas count in the YAML manifest and then apply the updated manifest

# Delete a StatefulSet
To delete a StatefulSet, use the kubectl delete command followed by the --file (or -f) option and supply the YAML manifest.
```
kubectl delete sts <sts-name>
```
# Conclusion
Kubernetes Deployments are suitable for running stateless applications, Kubernetes StatefulSets are tailored for stateful applications. Understanding when and how to use StatefulSets is key to unlocking their full potential in Kubernetes.
